import { useRef } from "react";
import Webcam from "react-webcam";

const CameraCapture = ({ setUserFace, setIsImageCaptured, setImageCaptureModal }) => {
  const webcamRef = useRef(null);

  const captureImage = () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const imageFile = new File([blob], "capture.png", { type: "image/png" });
          setUserFace(imageFile);
          setIsImageCaptured(true);
          setImageCaptureModal(false);
        });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl flex flex-col items-center relative">
        <div className="relative w-[300px] h-[300px] rounded-full overflow-hidden">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/png"
            videoConstraints={{ facingMode: "user" }}
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        <div className="mt-4 flex gap-4">
          <button
            onClick={captureImage}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
          >
            Capture
          </button>
          <button
            onClick={() => setImageCaptureModal(false)}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
