import csv

csv_path = r"d:\BCECE college predictor\REVISED_PCMB-Joint_1st_Round_Allotment_16082025.xlsx.csv"

print("Checking SKMCH Muzaffarpur B.Sc. Nursing allotments:")
with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        inst = row['institute'].strip()
        branch = row['branch'].strip()
        if "SKMCH" in inst and "Nursing" in branch:
            print(f"Name: {row['name']}, Gender: {row['gender']}, Category: {row['category']}, PCB_UR: {row['pcb_ur_rank']}, PCB_Cat: {row['pcb_cat_rank']}, PCB_RCG: {row['pcb_rcg_rank']}, Allotted_Cat: {row['allotted_cat']}, Seat_Type: {row['seat_type']}")
