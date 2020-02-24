def orm_to_dict(sql):
    d1 = []
    counter = 0
    for row in sql:
        d2 = {}
        for column in row.__table__.columns:
            d2[column.name] = getattr(row, column.name)
        counter += 1
        d1.append(d2)
    return d1
