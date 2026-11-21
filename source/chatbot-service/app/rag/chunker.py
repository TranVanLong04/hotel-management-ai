import re
from typing import List, Dict, Any


class KnowledgeChunker:
    """Splits parsed document sections into semantic chunks with access scopes."""

    def __init__(self, max_chars: int = 1000, overlap_chars: int = 150):
        self.max_chars = max_chars
        self.overlap_chars = overlap_chars

    def chunk_sections(self, sections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Processes sections and generates chunks with metadata."""
        chunks: List[Dict[str, Any]] = []

        for section in sections:
            h1 = section.get("h1", "").strip()
            h2 = section.get("h2", "").strip()
            h3 = section.get("h3", "").strip()

            # Construct hierarchical title
            title_parts = [p for p in [h1, h2, h3] if p]
            full_title = " > ".join(title_parts) if title_parts else "Thông tin chung"

            # Determine access scope: public vs admin_internal
            access_scope = "public"
            combined_headings = f"{h1} {h2} {h3}".lower()
            if any(k in combined_headings for k in ["nội bộ", "admin", "quy trình quản trị", "dành riêng nhân viên", "bảo mật"]):
                access_scope = "admin_internal"

            # Merge all content lines
            raw_text = "\n\n".join(section.get("content", [])).strip()
            if not raw_text:
                continue

            # Context prefix for each chunk
            context_prefix = f"【Chủ đề: {full_title}】\n"

            # If section content is small enough, make it a single chunk
            if len(raw_text) <= self.max_chars:
                chunks.append({
                    "section_title": full_title,
                    "access_scope": access_scope,
                    "chunk_content": f"{context_prefix}{raw_text}",
                    "metadata": {
                        "h1": h1,
                        "h2": h2,
                        "h3": h3,
                        "char_count": len(raw_text),
                        "source": "hotel_knowledge.docx",
                    },
                })
            else:
                # Split raw_text into overlapping chunks by sentences or paragraphs
                paragraphs = raw_text.split("\n\n")
                current_chunk_paras = []
                current_len = 0

                for para in paragraphs:
                    para = para.strip()
                    if not para:
                        continue

                    if current_len + len(para) > self.max_chars and current_chunk_paras:
                        chunk_body = "\n\n".join(current_chunk_paras)
                        chunks.append({
                            "section_title": full_title,
                            "access_scope": access_scope,
                            "chunk_content": f"{context_prefix}{chunk_body}",
                            "metadata": {
                                "h1": h1,
                                "h2": h2,
                                "h3": h3,
                                "char_count": len(chunk_body),
                                "source": "hotel_knowledge.docx",
                            },
                        })
                        # Keep last paragraph for overlap
                        current_chunk_paras = [current_chunk_paras[-1]] if len(current_chunk_paras[-1]) < self.overlap_chars else []
                        current_len = sum(len(p) for p in current_chunk_paras)

                    current_chunk_paras.append(para)
                    current_len += len(para)

                if current_chunk_paras:
                    chunk_body = "\n\n".join(current_chunk_paras)
                    chunks.append({
                        "section_title": full_title,
                        "access_scope": access_scope,
                        "chunk_content": f"{context_prefix}{chunk_body}",
                        "metadata": {
                            "h1": h1,
                            "h2": h2,
                            "h3": h3,
                            "char_count": len(chunk_body),
                            "source": "hotel_knowledge.docx",
                        },
                    })

        return chunks

