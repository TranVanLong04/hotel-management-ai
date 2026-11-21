import os
from typing import List, Dict, Any
import docx
from docx.table import Table
from docx.text.paragraph import Paragraph


class DocxParser:
    """Extracts structured text, headings, and tables from DOCX files."""

    def __init__(self, file_path: str):
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"DOCX file not found at: {file_path}")
        self.file_path = file_path
        self.doc = docx.Document(file_path)

    def parse(self) -> List[Dict[str, Any]]:
        """Parses the document into ordered sections with heading hierarchy."""
        sections: List[Dict[str, Any]] = []
        current_section = {
            "h1": "Giới thiệu chung",
            "h2": "",
            "h3": "",
            "content": [],
            "tables": [],
        }

        for element in self.doc.element.body:
            # Paragraph
            if element.tag.endswith("p"):
                p = Paragraph(element, self.doc)
                text = p.text.strip()
                if not text:
                    continue

                style_name = (p.style.name or "").lower()

                if "heading 1" in style_name:
                    if current_section["content"] or current_section["tables"]:
                        sections.append(current_section)
                    current_section = {
                        "h1": text,
                        "h2": "",
                        "h3": "",
                        "content": [],
                        "tables": [],
                    }
                elif "heading 2" in style_name:
                    if current_section["content"] or current_section["tables"]:
                        sections.append(current_section)
                    current_section = {
                        "h1": current_section["h1"],
                        "h2": text,
                        "h3": "",
                        "content": [],
                        "tables": [],
                    }
                elif "heading 3" in style_name:
                    if current_section["content"] or current_section["tables"]:
                        sections.append(current_section)
                    current_section = {
                        "h1": current_section["h1"],
                        "h2": current_section["h2"],
                        "h3": text,
                        "content": [],
                        "tables": [],
                    }
                else:
                    current_section["content"].append(text)

            # Table
            elif element.tag.endswith("tbl"):
                t = Table(element, self.doc)
                table_matrix = []
                for row in t.rows:
                    row_data = [cell.text.strip().replace("\n", " ") for cell in row.cells]
                    if any(row_data):
                        table_matrix.append(row_data)

                if table_matrix:
                    # Format table into Markdown representation
                    md_table = self._format_table_as_markdown(table_matrix)
                    current_section["tables"].append(md_table)
                    current_section["content"].append(md_table)

        if current_section["content"] or current_section["tables"]:
            sections.append(current_section)

        return sections

    @staticmethod
    def _format_table_as_markdown(matrix: List[List[str]]) -> str:
        """Formats a 2D matrix into a markdown table string."""
        if not matrix:
            return ""

        headers = matrix[0]
        separator = ["---"] * len(headers)
        lines = [
            "| " + " | ".join(headers) + " |",
            "| " + " | ".join(separator) + " |",
        ]

        for row in matrix[1:]:
            # Pad row if columns mismatch
            if len(row) < len(headers):
                row.extend([""] * (len(headers) - len(row)))
            elif len(row) > len(headers):
                row = row[: len(headers)]
            lines.append("| " + " | ".join(row) + " |")

        return "\n".join(lines)

