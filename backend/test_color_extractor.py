import unittest
from io import BytesIO

from PIL import Image

from backend.color_extractor import extract_dominant_colors, rgb_to_hex


class ColorExtractorTests(unittest.TestCase):
    def test_solid_white_image_returns_a_color(self):
        image_bytes = BytesIO()
        Image.new("RGB", (10, 10), "white").save(image_bytes, format="PNG")

        colors = extract_dominant_colors(image_bytes.getvalue())

        self.assertEqual(colors, [{"hex": "#ffffff", "rgb": [255, 255, 255]}])

    def test_rgb_hex_clamps_channels_to_valid_range(self):
        self.assertEqual(rgb_to_hex((256, -1, 42)), "#ff002a")


if __name__ == "__main__":
    unittest.main()
