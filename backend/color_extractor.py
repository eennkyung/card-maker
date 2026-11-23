from colorthief import ColorThief
from io import BytesIO
from PIL import Image, ImageStat


def normalize_rgb(rgb: tuple[int, int, int]) -> tuple[int, int, int]:
    return tuple(max(0, min(channel, 255)) for channel in rgb)


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*normalize_rgb(rgb))


def extract_dominant_colors(image_bytes: bytes, count: int = 6) -> list[dict]:
    """
    이미지 바이트에서 주요 색상을 추출합니다.

    Args:
        image_bytes: 이미지 파일 바이트
        count: 추출할 색상 개수 (기본값 6)

    Returns:
        [{"hex": "#rrggbb", "rgb": [r, g, b]}, ...]
    """
    image = Image.open(BytesIO(image_bytes)).convert("RGBA")
    has_palette_pixels = any(
        alpha >= 125 and not (red > 250 and green > 250 and blue > 250)
        for red, green, blue, alpha in image.getdata()
    )

    if not has_palette_pixels:
        visible_pixels = image.getchannel("A").point(
            lambda alpha: 255 if alpha >= 125 else 0
        )
        if visible_pixels.getbbox() is None:
            raise ValueError("The image has no visible pixels to extract colors from.")
        average = ImageStat.Stat(image.convert("RGB"), mask=visible_pixels).mean
        color = normalize_rgb(tuple(round(channel) for channel in average))
        return [{"hex": rgb_to_hex(color), "rgb": list(color)}]

    thief = ColorThief(BytesIO(image_bytes))

    if count == 1:
        dominant = normalize_rgb(thief.get_color(quality=1))
        return [{"hex": rgb_to_hex(dominant), "rgb": list(dominant)}]

    palette = thief.get_palette(color_count=count, quality=1)
    normalized_palette = [normalize_rgb(color) for color in palette]
    return [
        {"hex": rgb_to_hex(color), "rgb": list(color)}
        for color in normalized_palette
    ]
