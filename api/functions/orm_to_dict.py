def orm_to_dict(sql):
    rtr_list = []
    for row in sql:
        row_contents = {}
        for column in row.__table__.columns:
            row_contents[column.name] = getattr(row, column.name)
        rtr_list.append(row_contents)
    return rtr_list
