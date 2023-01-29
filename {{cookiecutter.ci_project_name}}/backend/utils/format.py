from django.contrib.gis.geos import MultiPolygon, Polygon


def clean_email(email):
    return email and str(email).strip().lower()


def clean_phone(phone):
    return phone and "".join(n for n in phone if str.isdigit(n))


def verify_phone(phone):
    if not phone:
        return False
    phone = clean_phone(phone)
    if not phone:
        return False
    if len(phone) == 11 and phone[0] == "1":
        phone = phone[1:]
    return len(phone) == 10 and phone


def to_usa_phone(phone):
    phone = verify_phone(phone)
    return phone and f"+1 ({phone[:3]}) {phone[3:6]}-{phone[6:]}"


def geojson_fc_to_mpoly(geojson_fc):
    if not geojson_fc:
        return None
    if geojson_fc["type"] != "FeatureCollection":
        raise ValueError("Invalid geojson")
    if not geojson_fc["features"]:
        return None

    def maybe_unpack(coordinates):
        if isinstance(coordinates[0], list) and isinstance(coordinates[0][0], list):
            print("unpacking", coordinates)
            return coordinates[0]

    def get_poly(geojson_poly):
        print("Parsing polygon", geojson_poly)
        return Polygon(maybe_unpack(geojson_poly["geometry"]["coordinates"]))

    polygons = [get_poly(poly) for poly in geojson_fc["features"] if poly["geometry"]["type"] == "Polygon"]

    print("Got polygons", polygons)

    return MultiPolygon(polygons)
