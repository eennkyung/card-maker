from colorthief import ColorThief
from io import BytesIO


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def extract_dominant_colors(image_bytes: bytes, count: int = 6) -> list[dict]:
    """
    이미지 바이트에서 주요 색상을 추출합니다.

    Args:
        image_bytes: 이미지 파일 바이트
        count: 추출할 색상 개수 (기본값 6)

    Returns:
        [{"hex": "#rrggbb", "rgb": [r, g, b]}, ...]
    """
    thief = ColorThief(BytesIO(image_bytes))

    if count == 1:
        dominant = thief.get_color(quality=1)
        return [{"hex": rgb_to_hex(dominant), "rgb": list(dominant)}]

    palette = thief.get_palette(color_count=count, quality=1)
    return [{"hex": rgb_to_hex(color), "rgb": list(color)} for color in palette]
