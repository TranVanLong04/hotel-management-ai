import os
import sys
import pytest

# Ensure project root in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.rag.docx_parser import DocxParser
from app.rag.chunker import KnowledgeChunker


def test_docx_parser_and_chunker():
    docx_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge", "hotel_knowledge.docx")
    assert os.path.exists(docx_path), "hotel_knowledge.docx must exist for test"

    # 1. Test parsing
    parser = DocxParser(docx_path)
    sections = parser.parse()
    assert len(sections) > 0, "DocxParser should extract multiple sections"

    # Check some section headings
    h1_list = [s["h1"] for s in sections]
    assert any("Giới thiệu" in h for h in h1_list)
    assert any("Check-in" in h or "Check-out" in h for h in h1_list)

    # 2. Test chunker
    chunker = KnowledgeChunker(max_chars=600, overlap_chars=100)
    chunks = chunker.chunk_sections(sections)
    assert len(chunks) > 0, "Chunker should produce chunks"

    # Verify access scopes
    scopes = [c["access_scope"] for c in chunks]
    assert "public" in scopes
    assert "admin_internal" in scopes, "Internal admin section must have admin_internal scope"

    # Verify chunk structure
    for c in chunks:
        assert "section_title" in c
        assert "chunk_content" in c
        assert "metadata" in c
        assert len(c["chunk_content"]) > 0

