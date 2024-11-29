import { EASINGS } from "@chakra-ui/react";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api/";

const LOGIN_URL = `${BASE_URL}token/`;
const HISTORY_URL = `${BASE_URL}history/`;
const USAGES_URL = `${BASE_URL}getUsages/`;
const REFRESH_URL = `${BASE_URL}token/refresh/`;
const AUTH_CHECK_URL = `${BASE_URL}authcheck/`;
const LOGOUT_URL = `${BASE_URL}logout/`;
const ADMIN_URL = `${BASE_URL}checkAdmin/`;
const CREATE_USER = `${BASE_URL}createUser/`;
const PASSWORD_URL = `${BASE_URL}changePassword/1/`;
const PATIENT_DATA_URL = `${BASE_URL}changePatient/`;
const IMAGE_DATA_URL = `${BASE_URL}changeImage/`;
const IMAGES_URL = `${BASE_URL}getAllImages/`;
const DOWNLOAD_FILE = `${BASE_URL}downloadFile/`;
const DOWNLOAD_REPORT = `${BASE_URL}downloadReport/`;
const CLASSIFY_URL = `${BASE_URL}classify/`;
const REPORTS_URL = `${BASE_URL}getUsageReports/`
const PATIENTS_URL = `${BASE_URL}getAllPatients/`
const SINGLE_CLASSIFY_URL = `${BASE_URL}singleImageClassification/`
const MULTIPLE_CLASSIFY_URL = `${BASE_URL}checkMultipleFiles/`
// axios.defaults.withCredentials = true;

var fileDownload = require('js-file-download');

export const login = async (username, password) => {
  await axios.post(
    LOGIN_URL,
    { username, password },
    { withCredentials: true }
  );

  return true;
};

export const logout = async (username, password) => {
  await axios.post(LOGOUT_URL, {}, { withCredentials: true });

  return true;
};

export const createUser = async (
  username,
  first_name,
  last_name,
  email,
  PESEL
) => {
  await axios.post(
    CREATE_USER,
    { username, first_name, last_name, email, PESEL },
    { withCredentials: true }
  );

  return true;
};

export const singleImageCLassification = async (patient,image) => {
  const formData = new FormData();
  formData.append('patient',JSON.stringify(patient));
  formData.append('photo',image);
  const response = await axios.post(SINGLE_CLASSIFY_URL,formData,{withCredentials: true});
  return response
}

export const multipleImagesCLassification = async (requestData) => {
  const formData = new FormData();
  formData.append('patients',JSON.stringify(requestData['patients']));
  requestData['photos'].forEach(image => {
    formData.append('photos', image);
  });
  const response = await axios.post(MULTIPLE_CLASSIFY_URL,formData,{withCredentials: true});
  return response
}


export const changePassword = async (new_password) => {
  await axios.put(PASSWORD_URL, { new_password }, { withCredentials: true });

  return true;
};

export const changePatient = async (request_data,pk) => {
  await axios.patch(`${PATIENT_DATA_URL}${pk}/`, { ...request_data }, { withCredentials: true });

  return true;
};

export const changeImage = async (request_data,pk) => {
  await axios.patch(`${IMAGE_DATA_URL}${pk}/`, { ...request_data }, { withCredentials: true });

  return true;
};

export const classify = async (tumor_type,pk) => {
  await axios.put(`${CLASSIFY_URL}${pk}/`, { tumor_type }, { withCredentials: true });

  return true;
};

export const getHistory = async () => {
  const response = await axios.get(HISTORY_URL, { withCredentials: true });
  return response.data;
};

export const getPatients = async () => {
  const response = await axios.get(PATIENTS_URL, { withCredentials: true });
  return response.data;
};

export const getImages = async () => {
  const response = await axios.get(IMAGES_URL, { withCredentials: true });
  return response.data;
};

export const getReports = async () => {
  const response = await axios.get(REPORTS_URL, { withCredentials: true });
  return response.data;
};

export const getUsages = async () => {
  const response = await axios.get(USAGES_URL, { withCredentials: true });
  return response.data;
};

export const getIsAdmin = async () => {
  const response = await axios.get(ADMIN_URL, { withCredentials: true });
  return response.data.is_admin;
};

export const downloadFile = async (id,filename) => {
  axios
    .post(
      DOWNLOAD_FILE,
      { id },
      { withCredentials: true, responseType: "blob" }
    )
    .then((res) => {
      fileDownload(res.data, filename);
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });
};


export const downloadReport = async (id,filename) => {
  axios
    .post(
      DOWNLOAD_REPORT,
      { id },
      { withCredentials: true, responseType: "blob" }
    )
    .then((res) => {
      fileDownload(res.data, filename);
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });
};

export const refresh = async () => {
  await axios.post(REFRESH_URL, {}, { withCredentials: true });
  return true;
};

export const is_auth = async () => {
  await axios.get(AUTH_CHECK_URL, { withCredentials: true });
  return true;
};
