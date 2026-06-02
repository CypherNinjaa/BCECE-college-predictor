import csv

csv_path = r"d:\BCECE college predictor\2nd_round_data.csv"

allotments = []
with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        branch = row['branch'].strip()
        allotted_cat = row['allotted_cat'].strip()
        if "Nursing" in branch and allotted_cat == "UR":
            pcb_ur_rank = row['pcb_ur_rank'].strip()
            if pcb_ur_rank:
                try:
                    rank_num = int(pcb_ur_rank.split('-')[1].strip())
                    allotments.append((rank_num, row['name'].strip(), row['gender'].strip(), row['category'].strip(), row['institute'].strip(), row['seat_type'].strip()))
                except:
                    pass

allotments.sort(key=lambda x: x[0])
print(f"Round 2 B.Sc. Nursing UR allotments count: {len(allotments)}")
for idx, allot in enumerate(allotments):
    if allot[0] > 550:
        print(f"Rank: {allot[0]}, Name: {allot[1]}, Gender: {allot[2]}, Cat: {allot[3]}, Inst: {allot[4]}, Seat: {allot[5]}")
