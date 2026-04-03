from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from contextlib import asynccontextmanager
import joblib

from inference import preprocess_for_inference, load_scaler, LABEL_DECODING


ModelName = Literal["bagging", "boosting", "stacking", "voting"]
DEFAULT_MODEL = "voting"  # ganti sesuai hasil evaluasi nanti

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load artefak sekali saat startup
    app.state.scaler = load_scaler("artifacts/scaler.pkl")
    app.state.models  = {
        "bagging": joblib.load("artifacts/bagging_model.pkl"),
        "boosting": joblib.load("artifacts/boosting_model.pkl"),
        # "stacking": joblib.load("artifacts/stacking_model.pkl"), #TODO
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
    ipk_total:       float = Field(ge=0.0, le=4.0)
    sks_semester:    int   = Field(ge=1)
    total_sks:       int   = Field(ge=0)
    sks_lulus:       int   = Field(ge=0)
    sks_tidak_lulus: int   = Field(ge=0)

class PredictRequest(BaseModel):
    student_id: str
    history:    list[SemesterEntry] = Field(min_length=1)

    @field_validator("history")
    @classmethod
    def history_same_strata(cls, v):
        strata_set = {entry.strata for entry in v}
        if len(strata_set) > 1:
            raise ValueError("semua semester harus memiliki strata yang sama")
        return v

class PredictResponse(BaseModel):
    student_id: str
    prediction: str
    probability: dict[str, float]
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
    {
        "student_id": "abc123",
        "history": [
            {"strata": "S1", "semester": 1, "ip_semester": 2.5,
             "ipk_total": 2.5, "sks_semester": 20, "total_sks": 20,
             "sks_lulus": 18, "sks_tidak_lulus": 2},
            ...
        ]
    }
    """
    X = preprocess_for_inference(
        history=[entry.model_dump() for entry in request.history],
        scaler=app.state.scaler,
    )
    model = app.state.models.get(model_name)
    pred_encoded  = model.predict(X)[0]
    pred_proba    = model.predict_proba(X)[0]
    pred_label    = LABEL_DECODING[pred_encoded]

    return PredictResponse(
        student_id=request.student_id,
        prediction=pred_label,
        probability={
            LABEL_DECODING[i]: round(float(p), 4)
            for i, p in enumerate(pred_proba)
        },
        from_model=model_name,
    )


# To run:
# uvicorn server:app --host 0.0.0.0 --port 8000