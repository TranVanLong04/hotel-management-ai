from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from app.core.config import settings
from app.core.logger import logger
from app.rag.embeddings import OpenAIEmbedder


class KnowledgeRetriever:
    """Retrieves relevant knowledge chunks from Supabase pgvector."""

    def __init__(self, supabase_client: Optional[Client] = None, embedder: Optional[OpenAIEmbedder] = None):
        self.embedder = embedder or OpenAIEmbedder()
        self.supabase = supabase_client or self._init_supabase()

    @staticmethod
    def _init_supabase() -> Client:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.")
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    def search(
        self,
        query: str,
        target_scope: str = "public",
        match_threshold: float = 0.45,
        match_count: int = 4,
    ) -> List[Dict[str, Any]]:
        """Performs vector similarity search against chat_knowledge_chunks.
        
        Args:
            query: The user's question or search query.
            target_scope: 'public' for customer bot, 'admin_internal' for staff/admin.
            match_threshold: Minimum cosine similarity score (0.0 to 1.0).
            match_count: Maximum number of chunks to return.
        """
        try:
            # 1. Generate query embedding (768D)
            query_vector = self.embedder.embed_query(query)

            # 2. Call Supabase RPC function `match_knowledge_chunks`
            response = self.supabase.rpc(
                "match_knowledge_chunks",
                {
                    "query_embedding": query_vector,
                    "match_threshold": match_threshold,
                    "match_count": match_count,
                    "target_scope": target_scope,
                },
            ).execute()

            results = response.data or []
            logger.info(f"RAG search query='{query[:50]}' found {len(results)} chunks (scope={target_scope})")
            return results

        except Exception as e:
            logger.error(f"Error during knowledge retrieval: {e}")
            return []

