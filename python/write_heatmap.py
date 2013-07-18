#Some key imports.
#Struct is used to create the actual bytes.
#It is super handy for this type of thing.
import struct, random

chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZ';
chars_length = len(chars)

def random_label(label_length):
    return ''.join([chars[int(random.random() * chars_length)] for x in range(label_length)])

#Function to generate a random float between 0 and 1
def random_float():
    x = random.uniform(0,1)
    return x

def random_label_list(size, label_length):
    return [ (random_label(label_length) + '\0') for x in range(size) ]

def pack_string(a,b):
    return a + struct.pack('<c',b)

def label_array(size, label_length):
    rows = random_label_list(size, label_length)
    the_bytes = ''
    length = 0
    for i in rows:
        the_bytes = the_bytes + i
        length = length + len(i)
    return struct.pack('<H',length) + struct.pack('<H',size) + the_bytes, length + 4


#Function to write a bmp file.  It takes a dictionary (d) of
#header values and the pixel data (bytes) and writes them
#to a file.  This function is called at the bottom of the code.
def matrix_write(d,the_bytes):

    rows, row_size = label_array(d['height'],5)
    cols, cols_size = label_array(d['width'],5)

    matrix_offset = d['offset'] + cols_size + row_size

    filesize = struct.pack('<L',d['filesize'])
    undef1 = struct.pack('<H',d['undef1'])
    undef2 = struct.pack('<H',d['undef2'])
    offset = struct.pack('<L',matrix_offset)
    dataType = struct.pack('<B',d['dataType'])
    width = struct.pack('<H',d['width'])
    height = struct.pack('<H',d['height'])
    datasize = struct.pack('<L',d['datasize'])


    #create the outfile
    outfile = open('heatmap.bin','wb')
    #write the header + the_bytes
    outfile.write(filesize+undef1+undef2+offset+dataType+width+height+datasize+rows+cols+the_bytes)
    outfile.close()

###################################    
def main():
    #Here is a minimal dictionary with header values.
    #Of importance is the offset, headerlength, width,
    #height and colordepth.
    #Edit the width and height to your liking.
    #These header values are described in the bmp format spec.
    #You can find it on the internet. This is for a Windows
    #Version 3 DIB header.
    d = {
        'filesize':0,
        'undef1':0,
        'undef2':0,
        'offset':21,
        'dataType':0,
        'width':50,
        'height':50,
        'datasize':2500,
        }

    #Build the byte array.  This code takes the height
    #and width values from the dictionary above and
    #generates the pixels row by row.  The row_mod and padding
    #stuff is necessary to ensure that the byte count for each
    #row is divisible by 4.  This is part of the specification.
    the_bytes = ''
    for row in range(d['height']):# (BMPs are L to R from the bottom L row)
        for column in range(d['width']):
            b = column / float(d['width']) + (random_float() * 1 / float(d['width']))
            pixel = struct.pack('<f',b)
            the_bytes = the_bytes + pixel
    #call the bmp_write function with the
    #dictionary of header values and the
    #bytes created above.
    matrix_write(d,the_bytes)

if __name__ == '__main__':
    main()



