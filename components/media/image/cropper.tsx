import React from 'react';
import { Cropper, CropperRef } from 'react-advanced-cropper';

export const imgCropper = ({imageUrl}) => {
    const cropperRef = useRef<CropperRef>(null);
    const zoom = () => {
        if (cropperRef.current) {
            cropperRef.current.zoomImage(2); // zoom-in 2x
        }
    };
    const move = () => {
        if (cropperRef.current) {
            cropperRef.current.moveImage(50, 100); // move x = 50, y = 100
        }
    };
    return (
        <Cropper
            ref={cropperRef}
            src={
                imageUrl
            }
        />
    );
};
