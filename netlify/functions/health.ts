export const handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      status: "ok",
      app: "INCO Smart Shop",
      environment: process.env.NODE_ENV || "production",
      timestamp: new Date().toISOString(),
    }),
  };
};
