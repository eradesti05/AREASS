from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, Literal
from contextlib import asynccontextmanager
import joblib

from inference import preprocess_for_inference, load_scaler, LABEL_DECODING


ModelName = Literal["bagging-dt", "bagging-svm", "bagging-lrm", "boosting", "stacking", "voting"]
DEFAULT_MODEL = "voting"  # ganti sesuai hasil evaluasi nanti

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load artefak sekali saat startup
    app.state.scaler = load_scaler("artifacts/scaler.pkl")
    app.state.models  = {
        "bagging-dt": joblib.load("artifacts/bagging_model_dt.pkl"),
        "bagging-svm": joblib.load("artifacts/bagging_model_svm.pkl"),
        "bagging-lrm": joblib.load("artifacts/bagging_model_lrm.pkl"),
        "boosting": joblib.load("artifacts/boosting_model.pkl"),
        "stacking": joblib.load("artifacts/stacking_model.pkl"),
        "voting": joblib.load("artifacts/voting_model.pkl")
    }
    yield


app = FastAPI(title="AREASS ML API", version="0.1.0", lifespan=lifespan)


class HealthResponse(BaseModel):
    status: str
    detail: Optional[str] = None

class SemesterEntry(BaseModel):
    strata:          Literal["S1", "S2", "S3"]
    semester:        int   = Field(ge=1)
    ip_semester:     float = Field(ge=0.0, le=4.0)
    sks_semester:    int   = Field(ge=1)
    total_sks:       int   = Field(ge=0)
    sks_lulus:       int   = Field(ge=0)

    @model_validator(mode="after")
    def sks_lulus_tidak_melebihi_semester(self):
        if self.sks_lulus > self.sks_semester:
            raise ValueError(
                f"sks_lulus ({self.sks_lulus}) tidak boleh melebihi "
                f"sks_semester ({self.sks_semester})"
            )
        return self

class StrataEntry(BaseModel):
    strata: Literal["S1", "S2", "S3"]

    ipk_total:  float = Field(ge=0.0, le=4.0)
    history:    list[SemesterEntry] = Field(min_length=1)

    # validate strata harus S1, S2, atau S3
    @field_validator("strata")
    def validate_strata(cls, v):
        if v not in {"S1", "S2", "S3"}:
            raise ValueError("strata harus salah satu dari 'S1', 'S2', atau 'S3'")
        return v
    
class PredictRequest(BaseModel):
    student_id: str
    predictions: list[StrataEntry] = Field(min_length=1, max_length=3)


class StrataResponse(BaseModel):
    prediction: str
    probability: dict[str, float]

class PredictResponse(BaseModel):
    student_id: str
    S1: Optional[StrataResponse] = None
    S2: Optional[StrataResponse] = None
    S3: Optional[StrataResponse] = None
    from_model: Optional[str] = None

@app.get("/", response_model=HealthResponse)
async def root():
    return HealthResponse(status="ok", detail="AREASS ML server running")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy")


@app.post("/predict")
@app.post("/predict/{model_name}")
async def predict(request: PredictRequest, model_name: ModelName = DEFAULT_MODEL) -> PredictResponse:
    """
    Payload yang diharapkan:
    ```
    {
        "student_id": "abc123",
        "ipk_total": 2.012,
        "history": [
            {
                "strata": "S2",
                "semester": 1,
                "ip_semester": 2.259,
                "sks_semester": 21,
                "total_sks": 21,
                "sks_lulus": 18
            },
            ...
        ]
    }
    ```
    """
    response = PredictResponse(student_id=request.student_id, from_model=model_name)
    for entry in request.predictions:
        X = preprocess_for_inference(
            history=[entry.model_dump() for entry in entry.history],
            scaler=app.state.scaler,
        )
        model = app.state.models.get(model_name)
        pred_encoded  = model.predict(X)[0]
        pred_proba    = model.predict_proba(X)[0]
        pred_label    = LABEL_DECODING[pred_encoded]

        response_entry = StrataResponse(
            prediction=pred_label,
            probability={LABEL_DECODING[i]: float(prob) for i, prob in enumerate(pred_proba)}
        )
        if entry.strata == "S1":
            response.S1 = response_entry
        elif entry.strata == "S2":
            response.S2 = response_entry
        elif entry.strata == "S3":
            response.S3 = response_entry

    return response


# To run:
# uvicorn server:app --host 0.0.0.0 --port 8000