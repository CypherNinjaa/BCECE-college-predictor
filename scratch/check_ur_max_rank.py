import csv

csv_path = r"d:\BCECE college predictor\REVISED_PCMB-Joint_1st_Round_Allotment_16082025.xlsx.csv"

print("Checking UR category candidates who got B.Sc. Nursing:")
max_ur_candidate_rank = 0
max_ur_candidate = None

with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        branch = row['branch'].strip()
        cat = row['category'].strip()
        if "Nursing" in branch and cat == "UR":
            pcb_ur_rank = row['pcb_ur_rank'].strip()
            if pcb_ur_rank:
                rank_num = int(pcb_ur_rank.split('-')[1].strip())
                print(f"Rank: {rank_num}, Name: {row['name']}, Gender: {row['gender']}, Inst: {row['institute']}, Allotted_Cat: {row['allotted_cat']}, Seat_Type: {row['seat_type']}")
                if rank_num > max_ur_candidate_rank:
                    max_ur_candidate_rank = rank_num
                    max_ur_candidate = row

print(f"\nMax UR Category candidate rank who got B.Sc. Nursing: {max_ur_candidate_rank}")
if max_ur_candidate:
    print(f"Name: {max_ur_candidate['name']}, College: {max_ur_candidate['institute']}, Allotted Category: {max_ur_candidate['allotted_cat']}, Seat Type: {max_ur_candidate['seat_type']}")
