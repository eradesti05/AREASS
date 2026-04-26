import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const TrendCharts = ({ akademikData = [] }) => {
  console.log("📊 TrendCharts received akademikData:", akademikData);
  
  // Transform akademik data ke format grafik
  const transformData = () => {
    if (!Array.isArray(akademikData) || akademikData.length === 0) {
      console.log("⚠️ TrendCharts: No data or not array");
      return { sks: [], ipk: [] };
    }

    const sorted = [...akademikData].sort((a, b) => a.semesterKe - b.semesterKe);
    console.log("📊 TrendCharts sorted data:", sorted);
    
    // Debug - lihat field names dari item pertama
    if (sorted.length > 0) {
      console.log("📊 First item keys:", Object.keys(sorted[0]));
      console.log("📊 sksPerSemester value:", sorted[0].sksPerSemester);
      console.log("📊 ipSemester value:", sorted[0].ipSemester);
    }

    const sksTrendData = sorted.map((item) => ({
      semester: `Sem ${item.semesterKe}`,
      sks: item.sksPerSemester || 0,
    }));

    const ipkTrendData = sorted.map((item) => ({
      semester: `Sem ${item.semesterKe}`,
      ipk: item.ipSemester || 0,
    }));

    return { sks: sksTrendData, ipk: ipkTrendData };
  };

  const { sks: sksTrendData, ipk: ipkTrendData } = transformData();
  
  console.log("📊 sksTrendData after transform:", sksTrendData);
  console.log("📊 ipkTrendData after transform:", ipkTrendData);
  console.table(sksTrendData);
  console.table(ipkTrendData);

  // Show message if no data
  if (!sksTrendData || sksTrendData.length === 0) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "clamp(12px, 2vw, 20px)",
          marginBottom: "clamp(20px, 3vw, 32px)",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
            color: "#8b8377",
          }}
        >
          Belum ada data akademik
        </div>
      </div>
    );
  }

  // Custom tooltip styling
  const customTooltip = {
    contentStyle: {
      backgroundColor: "#ffffff",
      border: "1px solid #e0dbd1",
      borderRadius: "6px",
      padding: "8px 12px",
      fontSize: "12px",
    },
    labelStyle: { color: "#8b8377" },
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "clamp(12px, 2vw, 20px)",
        marginBottom: "clamp(20px, 3vw, 32px)",
      }}
    >
      {/* Left Card - Bar Chart */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "20px",
          border: "none",
          boxShadow: "none",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#8b8377",
            marginBottom: "16px",
            letterSpacing: "0.5px",
            margin: "0 0 16px 0",
          }}
        >
          TREND BEBAN SKS
        </h2>
        {sksTrendData && sksTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sksTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="0" stroke="transparent" vertical={false} />
              <XAxis
                dataKey="semester"
                tick={{ fill: "#a39c94", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                hide={true}
                domain={[0, 20]}
              />
              <Tooltip {...customTooltip} />
              <Bar
                dataKey="sks"
                fill="#7bbf9e"
                radius={[8, 8, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: "#a39c94", textAlign: "center", padding: "40px 20px" }}>
            Belum ada data SKS
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "12px",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8b8377" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#7bbf9e",
                borderRadius: "2px",
              }}
            />
            <span>Beban SKS</span>
          </div>
        </div>
      </div>

      {/* Right Card - Line Chart */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "20px",
          border: "none",
          boxShadow: "none",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#8b8377",
            marginBottom: "16px",
            letterSpacing: "0.5px",
            margin: "0 0 16px 0",
          }}
        >
          TREND IPK
        </h2>
        {ipkTrendData && ipkTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ipkTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 40 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e8e0d7"
                vertical={false}
                horizontalPoints={[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]}
              />
              <XAxis
                dataKey="semester"
                tick={{ fill: "#a39c94", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[1.0, 4.0]}
                tick={{ fill: "#a39c94", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip {...customTooltip} />
              <Line
                type="monotone"
                dataKey="ipk"
                stroke="#e9a84c"
                strokeDasharray="5 5"
                strokeWidth={2.5}
                dot={{
                  fill: "#e9a84c",
                  r: 5,
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 6,
                }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: "#a39c94", textAlign: "center", padding: "40px 20px" }}>
            Belum ada data IPK
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "12px",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8b8377" }}>
            <div
              style={{
                width: "12px",
                height: "2.5px",
                backgroundColor: "#e9a84c",
                backgroundImage: "linear-gradient(to right, #e9a84c 0%, #e9a84c 60%, transparent 60%)",
              }}
            />
            <span>IP Semester</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendCharts;