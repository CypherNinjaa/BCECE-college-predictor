import csv

csv_path = r"d:\BCECE college predictor\REVISED_PCMB-Joint_1st_Round_Allotment_16082025.xlsx.csv"

print("Searching for PCB UR ranks 600 to 605:")
with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        pcb_ur_rank = row['pcb_ur_rank'].strip()
        if pcb_ur_rank:
            try:
                rank_num = int(pcb_ur_rank.split('-')[1].strip())
                if 600 <= rank_num <= 605:
                    print(f"Name: {row['name']}, Gender: {row['gender']}, Category: {row['category']}, PCB_UR: {row['pcb_ur_rank']}, PCB_Cat: {row['pcb_cat_rank']}, PCB_RCG: {row['pcb_rcg_rank']}, Institute: {row['institute']}, Branch: {row['branch']}, Allotted_Cat: {row['allotted_cat']}, Seat_Type: {row['seat_type']}")
            except Exception as e:
                pass
