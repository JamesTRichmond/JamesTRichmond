import tempfile
import unittest
from pathlib import Path

from scripts.validate_portfolio import Document


class DocumentTitleTests(unittest.TestCase):
    def test_svg_title_does_not_contribute_to_document_title(self):
        source = """<!doctype html>
<html lang="en">
<head><title>Portfolio page</title></head>
<body><svg><title>Accessible graphic name</title></svg></body>
</html>
"""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "page.html"
            path.write_text(source, encoding="utf-8")
            document = Document(path)

        self.assertEqual(document.title_count, 1)
        self.assertEqual(document.title, "Portfolio page")


if __name__ == "__main__":
    unittest.main()
