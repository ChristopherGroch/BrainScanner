import cv2
import numpy as np

original = cv2.imread("backend/Test.jpg")
duplicate = cv2.imread("backend/media/Images/Test.jpg")


if original.shape == duplicate.shape:
    print("The images have same size and channels")
difference = cv2.subtract(original, duplicate)
b, g, r = cv2.split(difference)
if cv2.countNonZero(b) == 0 and cv2.countNonZero(g) == 0 and cv2.countNonZero(r) == 0:
    print("The images are completely Equal")
    
