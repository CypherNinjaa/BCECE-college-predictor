import fitz
import csv
import re
from pathlib import Path

def clean_text(val):
    return re.sub(r'\s+', ' ', val).strip()

def parse_pdf(pdf_path, csv_path):
    doc = fitz.open(pdf_path)
    rows = []
    
    # State tracking across lines
    current_inst_acc = ""
    current_branch_acc = ""
    
    last_valid_inst = ""
    last_valid_branch = ""
    
    for page_idx, page in enumerate(doc, start=1):
        words = page.get_text("words")
        
        # Group words by lines using y-coordinate clustering
        lines = {}
        for w in words:
            y = w[1]
            found = False
            for y_key in lines:
                if abs(y_key - y) < 3:
                    lines[y_key].append(w)
                    found = True
                    break
            if not found:
                lines[y] = [w]
                
        # Sort lines by y-coordinate
        sorted_y = sorted(lines.keys())
        
        for y in sorted_y:
            line_words = sorted(lines[y], key=lambda item: item[0])
            line_text = " ".join([w[4] for w in line_words])
            
            # Skip page headers and footers
            if "COMBINED FIRST AND SECOND ROUND" in line_text or "Page No:-" in line_text:
                continue
            if "INSTITUTE BRANCH SEAT TYPE" in line_text or ("INSTITUTE" in line_text and "BRANCH" in line_text and "UR OPENING" in line_text):
                continue
                
            # Extract fields based on x-coordinates
            inst_parts = []
            branch_parts = []
            seat_parts = []
            cat_parts = []
            ur_op_parts = []
            ur_cl_parts = []
            cat_op_parts = []
            cat_cl_parts = []
            
            for w in line_words:
                x = w[0]
                text = w[4]
                if x < 145:
                    inst_parts.append(text)
                elif 145 <= x < 325:
                    branch_parts.append(text)
                elif 325 <= x < 375:
                    seat_parts.append(text)
                elif 375 <= x < 425:
                    cat_parts.append(text)
                elif 425 <= x < 510:
                    ur_op_parts.append(text)
                elif 510 <= x < 595:
                    ur_cl_parts.append(text)
                elif 595 <= x < 685:
                    cat_op_parts.append(text)
                else:
                    cat_cl_parts.append(text)
                    
            inst_str = clean_text(" ".join(inst_parts))
            branch_str = clean_text(" ".join(branch_parts))
            seat_str = clean_text(" ".join(seat_parts))
            cat_str = clean_text(" ".join(cat_parts))
            ur_op = clean_text(" ".join(ur_op_parts))
            ur_cl = clean_text(" ".join(ur_cl_parts))
            cat_op = clean_text(" ".join(cat_op_parts))
            cat_cl = clean_text(" ".join(cat_cl_parts))
            
            is_data_line = bool(seat_str or cat_str or ur_op or ur_cl or cat_op or cat_cl)
            
            if not is_data_line:
                # Continuation line
                if inst_str:
                    current_inst_acc = (current_inst_acc + " " + inst_str).strip()
                if branch_str:
                    current_branch_acc = (current_branch_acc + " " + branch_str).strip()
            else:
                # Data line
                # Resolve Institute
                if inst_str:
                    if current_inst_acc:
                        full_inst = (current_inst_acc + " " + inst_str).strip()
                        current_inst_acc = ""
                    else:
                        full_inst = inst_str
                    last_valid_inst = full_inst
                else:
                    full_inst = last_valid_inst
                    
                # Resolve Branch
                if branch_str:
                    if current_branch_acc:
                        full_branch = (current_branch_acc + " " + branch_str).strip()
                        current_branch_acc = ""
                    else:
                        full_branch = branch_str
                    last_valid_branch = full_branch
                else:
                    full_branch = last_valid_branch
                    
                rows.append({
                    "page_no": page_idx,
                    "institute": full_inst,
                    "branch": full_branch,
                    "seat_type": seat_str,
                    "category": cat_str,
                    "ur_opening": ur_op,
                    "ur_closing": ur_cl,
                    "cat_opening": cat_op,
                    "cat_closing": cat_cl
                })
                
    # Write to CSV
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["page_no", "institute", "branch", "seat_type", "category", "ur_opening", "ur_closing", "cat_opening", "cat_closing"])
        writer.writeheader()
        writer.writerows(rows)
        
    print(f"Extracted {len(rows)} rows to {csv_path}")

if __name__ == "__main__":
    parse_pdf("d:\\BCECE college predictor\\PCM_Enginering.pdf", "d:\\BCECE college predictor\\engineering_cutoffs.csv")
