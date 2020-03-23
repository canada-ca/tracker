import ast


def boolean_for(string):
    if string == "false":
        return False
    elif string == "true":
        return True
    return None


def formatted_dictionary(data):
    formatted = data.replace("false", "False").replace("true", "True").replace("null", "None").replace("none", "None")
    formatted_dict = ast.literal_eval(formatted)
    return formatted_dict
