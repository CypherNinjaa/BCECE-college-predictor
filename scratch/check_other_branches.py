import csv
from collections import defaultdict

csv_path = r"d:\BCECE college predictor\REVISED_PCMB-Joint_1st_Round_Allotment_16082025.xlsx.csv"

# Branch -> Category -> List of (rank, candidate_category, seat_type)
branch_data = defaultdict(lambda: defaultdict(list))

with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        branch = row['branch'].strip()
        allotted_cat = row['allotted_cat'].strip()
        pcb_ur_rank = row['pcb_ur_rank'].strip()
        pcm_ur_rank = row['pcm_ur_rank'].strip()
        
        # Determine the rank to use
        rank_num = None
        if pcb_ur_rank:
            try:
                rank_num = int(pcb_ur_rank.split('-')[1].strip())
            except:
                pass
        elif pcm_ur_rank:
            try:
                rank_num = int(pcm_ur_rank.split('-')[1].strip())
            except:
                pass
                
        if rank_num is not None:
            branch_data[branch][allotted_cat].append((rank_num, row['category'].strip(), row['seat_type'].strip(), row['gender'].strip()))

print("Comparison of UR Allotted Seat Cutoffs in Round 1 (Overall vs Pure UR Category Candidate):")
print("-" * 110)
print(f"{'Branch/Course':<40} | {'Seat Type':<15} | {'Overall Closing':<15} | {'Pure UR Closing':<15} | {'Difference'}")
print("-" * 110)

for branch, cats in sorted(branch_data.items()):
    if "UR" in cats:
        # Group by seat type (GENERAL SEAT vs FEMALE SEAT)
        by_seat_type = defaultdict(list)
        for rank, cand_cat, seat_type, gender in cats["UR"]:
            by_seat_type[seat_type].append((rank, cand_cat))
            
        for seat_type, list_of_ranks in by_seat_type.items():
            sorted_all = sorted(list_of_ranks, key=lambda x: x[0])
            overall_close = sorted_all[-1][0]
            
            # Filter for pure UR candidates
            pure_ur_ranks = [r for r, c in list_of_ranks if c == "UR"]
            if pure_ur_ranks:
                pure_ur_close = max(pure_ur_ranks)
                diff = overall_close - pure_ur_close
                diff_str = f"+{diff} ranks" if diff > 0 else "None"
                print(f"{branch:<40} | {seat_type:<15} | {overall_close:<15} | {pure_ur_close:<15} | {diff_str}")
            else:
                print(f"{branch:<40} | {seat_type:<15} | {overall_close:<15} | {'No pure UR':<15} | N/A")
