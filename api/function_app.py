import azure.functions as func
from fastapi import FastAPI
from pydantic import BaseModel


app = func.FunctionApp()
fast_api = FastAPI()

class HealthCheck(BaseModel):
    status: str = "OK"


@fast_api.get("/api/health", response_model=HealthCheck)
def health_check():
    return HealthCheck()


@app.route(route="{*route}", auth_level=func.AuthLevel.ANONYMOUS)
async def http_trigger(req: func.HttpRequest, context: func.Context) -> func.HttpResponse:
    return await func.AsgiMiddleware(fast_api).handle_async(req, context)
