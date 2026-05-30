#!/usr/bin/env python3
"""
Convert the BCECE allotment PDF table to CSV and verify that the CSV matches
the PDF extraction.

Usage:
    python pdf_to_csv_and_match.py REVISED_PCMB-Joint_1st_Round_Allotment_16082025.xlsx.pdf
    python pdf_to_csv_and_match.py input.pdf -o output.csv --report match_report.csv
    python pdf_to_csv_and_match.py input.pdf --match-only -o existing.csv
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover - depends on local environment
    print(
        "PyMuPDF is required. Install it with: python -m pip install pymupdf",
        file=sys.stderr,
    )
    raise


PDF_NAME = "REVISED_PCMB-Joint_1st_Round_Allotment_16082025.xlsx.pdf"
DEFAULT_PDF = Path(PDF_NAME)


COLUMN_RANGES: Sequence[Tuple[str, float, float]] = (
    ("roll_no", 0, 34),
    ("reg_no", 34, 68),
    ("sub_group", 68, 92),
    ("name", 92, 165),
    ("gender", 165, 184),
    ("category", 184, 210),
    ("pcm_ur_rank", 210, 238),
    ("pcm_cat_rank", 238, 267),
    ("pcm_rcg_rank", 267, 299),
    ("pcm_dq_rank", 299, 325),
    ("pcm_smq_rank", 325, 350),
    ("pcb_ur_rank", 350, 377),
    ("pcb_cat_rank", 377, 406),
    ("pcb_rcg_rank", 406, 438),
    ("pcb_dq_rank", 438, 463),
    ("pcb_smq_rank", 463, 489),
    ("institute", 489, 555),
    ("branch", 555, 607),
    ("allotted_cat", 607, 640),
    ("seat_type", 640, 673),
    ("remark", 673, 732),
    ("allotment_group", 732, 790),
)


CSV_COLUMNS: Sequence[str] = (
    "page_no",
    "row_no",
    "roll_no",
    "reg_no",
    "sub_group",
    "name",
    "gender",
    "category",
    "pcm_ur_rank",
    "pcm_cat_rank",
    "pcm_rcg_rank",
    "pcm_dq_rank",
    "pcm_smq_rank",
    "pcb_ur_rank",
    "pcb_cat_rank",
    "pcb_rcg_rank",
    "pcb_dq_rank",
    "pcb_smq_rank",
    "institute",
    "branch",
    "allotted_cat",
    "seat_type",
    "remark",
    "allotment_group",
)


Word = Tuple[float, float, float, float, str, int, int, int]
Row = Dict[str, str]
Mismatch = Dict[str, str]


def clean_text(value: str) -> str:
    """Normalize extraction whitespace for stable CSV output and matching."""
    return re.sub(r"\s+", " ", value).strip()


def column_for_x(x0: float) -> str | None:
    for name, left, right in COLUMN_RANGES:
        if left <= x0 < right:
            return name
    return None


def is_roll_marker(word: Word) -> bool:
    x0, y0, _x1, _y1, text, *_rest = word
    return x0 < 34 and y0 > 38 and text.isdigit()


def collect_field(words: Iterable[Word], column_name: str) -> str:
    parts: List[str] = []
    for word in sorted(words, key=lambda item: (round(item[1], 1), item[0])):
        if column_for_x(word[0]) == column_name:
            parts.append(word[4])
    return clean_text(" ".join(parts))


def extract_rows_from_pdf(pdf_path: Path) -> List[Row]:
    doc = fitz.open(pdf_path)
    rows: List[Row] = []

    for page_index, page in enumerate(doc, start=1):
        words: List[Word] = page.get_text("words")
        words.sort(key=lambda item: (item[1], item[0]))

        row_markers = [
            (round(word[1], 1), word[4])
            for word in words
            if is_roll_marker(word)
        ]

        for row_index, (row_y, _roll_text) in enumerate(row_markers, start=1):
            previous_y = row_markers[row_index - 2][0] if row_index > 1 else 33.0
            row_words = [
                word
                for word in words
                if previous_y + 0.4 < word[1] <= row_y + 0.8
            ]

            row: Row = {
                "page_no": str(page_index),
                "row_no": str(row_index),
            }
            for column_name, _left, _right in COLUMN_RANGES:
                row[column_name] = collect_field(row_words, column_name)

            if row.get("roll_no") and row.get("reg_no"):
                rows.append(row)

    return rows


def write_csv(rows: Sequence[Row], csv_path: Path) -> None:
    with csv_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in CSV_COLUMNS})


def read_csv_rows(csv_path: Path) -> List[Row]:
    with csv_path.open("r", newline="", encoding="utf-8-sig") as handle:
        return [
            {column: clean_text(row.get(column, "")) for column in CSV_COLUMNS}
            for row in csv.DictReader(handle)
        ]


def compare_rows(pdf_rows: Sequence[Row], csv_rows: Sequence[Row]) -> List[Mismatch]:
    mismatches: List[Mismatch] = []

    if len(pdf_rows) != len(csv_rows):
        mismatches.append(
            {
                "row_number": "",
                "roll_no": "",
                "reg_no": "",
                "field": "row_count",
                "pdf_value": str(len(pdf_rows)),
                "csv_value": str(len(csv_rows)),
            }
        )

    for index, (pdf_row, csv_row) in enumerate(zip(pdf_rows, csv_rows), start=1):
        roll_no = pdf_row.get("roll_no", "")
        reg_no = pdf_row.get("reg_no", "")
        for column in CSV_COLUMNS:
            pdf_value = clean_text(pdf_row.get(column, ""))
            csv_value = clean_text(csv_row.get(column, ""))
            if pdf_value != csv_value:
                mismatches.append(
                    {
                        "row_number": str(index),
                        "roll_no": roll_no,
                        "reg_no": reg_no,
                        "field": column,
                        "pdf_value": pdf_value,
                        "csv_value": csv_value,
                    }
                )

    return mismatches


def write_mismatch_report(mismatches: Sequence[Mismatch], report_path: Path) -> None:
    fieldnames = ("row_number", "roll_no", "reg_no", "field", "pdf_value", "csv_value")
    with report_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(mismatches)


def default_csv_path(pdf_path: Path) -> Path:
    return pdf_path.with_suffix(".csv")


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert the BCECE allotment PDF to CSV and verify CSV data."
    )
    parser.add_argument(
        "pdf",
        nargs="?",
        default=str(DEFAULT_PDF),
        help=f"PDF path. Defaults to {PDF_NAME!r} in the current folder.",
    )
    parser.add_argument(
        "-o",
        "--output",
        help="CSV output path. Defaults to the PDF name with .csv extension.",
    )
    parser.add_argument(
        "--report",
        default="match_report.csv",
        help="Mismatch report path. Defaults to match_report.csv.",
    )
    parser.add_argument(
        "--match-only",
        action="store_true",
        help="Do not rewrite the CSV; only compare the PDF with the CSV at --output.",
    )
    parser.add_argument(
        "--no-match",
        action="store_true",
        help="Only convert the PDF to CSV; skip the verification step.",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    pdf_path = Path(args.pdf)
    csv_path = Path(args.output) if args.output else default_csv_path(pdf_path)
    report_path = Path(args.report)

    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}", file=sys.stderr)
        return 2

    pdf_rows = extract_rows_from_pdf(pdf_path)
    print(f"Extracted {len(pdf_rows)} rows from {pdf_path}")

    if not args.match_only:
        write_csv(pdf_rows, csv_path)
        print(f"Wrote CSV: {csv_path}")

    if args.no_match:
        return 0

    if not csv_path.exists():
        print(f"CSV not found for matching: {csv_path}", file=sys.stderr)
        return 2

    csv_rows = read_csv_rows(csv_path)
    mismatches = compare_rows(pdf_rows, csv_rows)
    write_mismatch_report(mismatches, report_path)

    if mismatches:
        print(f"Match failed: {len(mismatches)} mismatch(es).")
        print(f"Mismatch report: {report_path}")
        return 1

    print("Match passed: CSV data matches the PDF extraction.")
    print(f"Mismatch report: {report_path} (0 mismatches)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
