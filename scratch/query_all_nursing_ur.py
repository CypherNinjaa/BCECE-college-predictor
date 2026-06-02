import csv
from collections import defaultdict

csv_path = r"d:\BCECE college predictor\REVISED_PCMB-Joint_1st_Round_Allotment_16082025.xlsx.csv"

# College -> Seat_Type -> List of (rank, category)
allotments = defaultdict(lambda: defaultdict(list))

with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        inst = row['institute'].strip()
        branch = row['branch'].strip()
        allotted_cat = row['allotted_cat'].strip()
        seat_type = row['seat_type'].strip()
        
        if "Nursing" in branch and allotted_cat == "UR":
            pcb_ur_rank = row['pcb_ur_rank'].strip()
            # Parse number from e.g. "JT.UR- 685"
            rank_num = int(pcb_ur_rank.split('-')[1].strip())
            allotments[inst][seat_type].append((rank_num, row['category'].strip(), row['name'].strip()))

print("B.Sc. Nursing UR allotments in Round 1:")
for college, seats in allotments.items():
    print(f"\nCollege: {college}")
    for seat_type, list_of_ranks in seats.items():
        sorted_ranks = sorted(list_of_ranks, key=lambda x: x[0])
        min_rank, min_cat, min_name = sorted_ranks[0]
        max_rank, max_cat, max_name = sorted_ranks[-1]
        print(f"  Seat Type: {seat_type}")
        print(f"    Total seats allotted under UR: {len(sorted_ranks)}")
        print(f"    Ranks: {min_rank} ({min_name}, {min_cat}) to {max_rank} ({max_name}, {max_cat})")
