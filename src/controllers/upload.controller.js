import cloudinary from 'cloudinary';
import 'dotenv/config';

/** ******
 * @class Upload
 *
 * @description Picture Upload
 *
 ********** */

class Upload {
  /**
   *  @static
   *
   * @param {object} request - {file named image}
   *
   * @returns {object} - status, data, size
   *
   *
   * @description This method is used to upload a picture to cloudinary
   * @memberOf Upload
   * */

  static async upLoadphoto(req, res) {
    const { image } = req.files;

    if (!image) {
      return res.status(400).json({ message: 'image file needed' });
    }
    try {
      return cloudinary.v2.uploader
        .upload(image.tempFilePath, { resourse_type: 'auto' })
        .then(async (result) => {
          if (!result) return res.status(400).json({ message: 'upload error' });
          // image response
          return res.status(200).json({
            status: 'Ok',
            data: result,
          });
        })
        .catch((err) => res.status(500).json({
          message: ` Error from server ${err}`,
        }));
    } catch (err) {
      return res.status(500).json({
        message: ' Error from server',
      });
    }
  }
}

export default Upload;
