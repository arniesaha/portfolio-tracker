from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./data/portfolio.db"

    # API Keys
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    news_api_key: str = ""

    # CORS
    allowed_origins: str = "http://localhost:5173"

    # Application
    debug: bool = True
    log_level: str = "INFO"
    use_mock_prices: bool = False  # Set to True to use mock prices instead of Yahoo Finance

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]


settings = Settings()
