from PIL import Image
import os

img_path = r"c:\Users\RODRIGO\Desktop\sistema para cabeleireiro\frontend\public\images\salao-masculino.png"
img = Image.open(img_path)

# A imagem tem overlay nos primeiros ~150px (navbar) e bottom (botões/texto)
# Vou cortar a imagem para remover overlay
width, height = img.size
print(f"Imagem original: {width}x{height}")

# Cortando 150px do topo e 100px do bottom para remover navbar e botões
crop_box = (0, 150, width, height - 100)
cropped = img.crop(crop_box)

print(f"Imagem cortada: {cropped.size}")

# Salvando a imagem cortada
cropped.save(img_path)
print("✅ Imagem atualizada com sucesso!")
