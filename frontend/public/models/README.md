# Face-api.js models (for Face Emotion Detection)

To enable **Face emotion detection** in the meeting, place the following model files in this folder (`public/models/`):

1. **tiny_face_detector** – from [@vladmandic/face-api](https://github.com/vladmandic/face-api/tree/master/model):
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1` (binary)

2. **face_expression_net** – for emotion (happy, sad, angry, etc.):
   - `face_expression_model-weights_manifest.json`
   - `face_expression_model-shard1` (binary)

**How to get the files:**  
Clone or download the [model folder](https://github.com/vladmandic/face-api/tree/master/model) from the face-api repo and copy the above files into `frontend/public/models/`.

After adding the files, restart the dev server and turn on "Face emotion" (😊) in the meeting controls.
