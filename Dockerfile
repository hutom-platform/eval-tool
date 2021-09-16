FROM pytorch/pytorch:1.8.0-cuda11.1-cudnn8-runtime

WORKDIR /OOB_RECOG
CMD [ "mkdir", "mount" ]

ADD requirements.txt .

RUN pip install -r requirements.txt