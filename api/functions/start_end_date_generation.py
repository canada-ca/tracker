def generate_start_end_date(current_date, past_date):
    # Generate End Date
    if current_date.month < 10:
        curr_month = f"0{current_date.month}"
    else:
        curr_month = current_date.month
    if current_date.day < 10:
        curr_day = f"0{current_date.day}"
    else:
        curr_day = current_date.day

    # Generate Start Date
    if past_date.month < 10:
        past_month = f"0{past_date.month}"
    else:
        past_month = past_date.month
    if past_date.day < 10:
        past_day = f"0{past_date.day}"
    else:
        past_day = past_date.day

    start_date = f"{past_date.year}-{past_month}-{past_day}"
    end_date = (
        f"{current_date.year}-{curr_month}-{curr_day}"
    )

    return start_date, end_date
