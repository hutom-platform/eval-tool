from __future__ import print_function, division

import os
import sys
import argparse
import torch
# from tqdm import tqdm
import platform

from test_model import CAMIO
from torch.utils.data import Dataset, DataLoader
from test_dataset import OOB_DB_Dataset, IDX_Sampler

image_datasets_dir = sys.argv[1]
model_path = './models/mobile.ckpt' if sys.argv[2] == 'mobile' else './models/efficient.ckpt'

def inference_by_frame_list(image_datasets_dir, model_path) :
    """
    Inference using frame img. 
    BATCH_SIZE = 64

    Args:
        image_datasets_dir: target datasets directory for infernece -> str:
        model: trainer model. we only support .ckpt extention. -> str:
    Return:
        BATCH_PREDICT (predict list) -> List[int]:
    """

    predict_list = [] # predict

    if 'mobile' in model_path :
        test_hparams = {
            'optimizer_lr' : 0, # dummy (this option use only for training)
            'backbone_model' : 'mobilenet_v3_large' # (for train, test)
        }
    elif 'efficient' in model_path :
        test_hparams = {
            'optimizer_lr' : 0, # dummy (this option use only for training)
            'backbone_model' : 'efficientnet_b3' # (for train, test)
        }
    
    model = CAMIO.load_from_checkpoint(model_path, config=test_hparams)
    # model.cuda()

    BATCH_SIZE = 64

    test_dataset = OOB_DB_Dataset(image_datasets_dir)

    # target idx
    TARGET_IDX_LIST = list(range(0, len(test_dataset)))

    # Set index for batch
    s = IDX_Sampler(TARGET_IDX_LIST, batch_size=BATCH_SIZE) #[[0, 100], [200, 300], ... , [136800,136900]]

    # set dataloader with custom batch sampler
    dl = DataLoader(test_dataset, batch_sampler=list(s))

    with torch.no_grad() :
        model.eval()
        # inferencing model
        for sample in dl:
            # BATCH_INPUT = sample['img'].cuda()
            BATCH_INPUT = sample['img']
            BATCH_OUTPUT = model(BATCH_INPUT)

            # predict
            BATCH_PREDICT = torch.argmax(BATCH_OUTPUT.cpu(), 1)
            BATCH_PREDICT = BATCH_PREDICT.tolist()

            # save results
            predict_list+= list(BATCH_PREDICT)

        # print('\n ==================================== \n')
        # print('len(predict_list) : ', len(predict_list))
        # print('\n ==================================== \n\n')
        # print('predict_list ====> \n', predict_list)
        # print('\n ==================================== \n')

    return predict_list

if __name__ == "__main__":
    ###  base setting for model testing ### 
    ### os.environ['CUDA_VISIBLE_DEVICES'] = '0,1'

    list = inference_by_frame_list(image_datasets_dir, model_path)
    print(list)
