def orm_to_dict(sql):
    rtr_list = []
    counter = 0
    for row in sql:
        row_contents = {}
        for column in row.__table__.columns:
            row_contents[column.name] = getattr(row, column.name)
        counter += 1
        rtr_list.append(row_contents)
    return rtr_list
