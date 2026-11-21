from typing import List, Optional
from langchain_openai import OpenAIEmbeddings
from app.core.config import settings
from app.core.logger import logger


class OpenAIEmbedder:
    """Wrapper for generating vector embeddings using OpenAI text-embedding-3-small (768D)."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_EMBEDDING_MODEL
        self._client: Optional[OpenAIEmbeddings] = None

    def _get_client(self) -> OpenAIEmbeddings:
        if not self._client:
            if not self.api_key:
                raise ValueError("OPENAI_API_KEY is not configured in settings or environment.")
            self._client = OpenAIEmbeddings(
                model=self.model,
                api_key=self.api_key,
                dimensions=768,  # Truncates cleanly to 768 to match PostgreSQL vector(768)
            )
        return self._client

    def embed_query(self, text: str) -> List[float]:
        """Embeds a single query string into a 768-dimensional float vector."""
        if not text or not text.strip():
            raise ValueError("Input text for embedding cannot be empty.")
        client = self._get_client()
        try:
            return client.embed_query(text)
        except Exception as e:
            logger.error(f"Error generating query embedding: {e}")
            raise e

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embeds a list of document strings into float vectors."""
        if not texts:
            return []
        client = self._get_client()
        try:
            logger.info(f"Generating embeddings for {len(texts)} document chunks...")
            return client.embed_documents(texts)
        except Exception as e:
            logger.error(f"Error generating document embeddings: {e}")
            raise e
