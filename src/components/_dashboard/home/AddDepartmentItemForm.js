import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { Form, FormikProvider, useFormik } from 'formik';
// material
import { LoadingButton } from '@mui/lab';
import { styled } from '@mui/material/styles';
import {
  Card,
  Grid,
  Chip,
  Stack,
  Button,
  Switch,
  TextField,
  Typography,
  Autocomplete,
  FormHelperText,
  FormControlLabel
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import axios from 'axios';
// utils
// import fakeRequest from '../../../utils/fakeRequest';
import { deleteFile, getValueByKey, uploadFile } from '../../../utils/api';
//
import axiosInstance from '../../../utils/axios';
// import { QuillEditor } from '../../editor';
import { UploadSingleFile } from '../../upload';
//
import BlogNewPostPreview from './AddSliderItemPreview';
import { createSlider, updateSlider } from '../../../redux/slices/slider';
import { PATH_DASHBOARD } from '../../../routes/paths';

// ----------------------------------------------------------------------

const TAGS_OPTION = [
  'Toy Story 3',
  'Logan',
  'Full Metal Jacket',
  'Dangal',
  'The Sting',
  '2001: A Space Odyssey',
  "Singin' in the Rain",
  'Toy Story',
  'Bicycle Thieves',
  'The Kid',
  'Inglourious Basterds',
  'Snatch',
  '3 Idiots'
];

const LabelStyle = styled(Typography)(({ theme }) => ({
  ...theme.typography.subtitle2,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1)
}));

// ----------------------------------------------------------------------

export default function AddDepartmentItemForm({ isEdit, currentProduct: currentSlider }) {
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const NewBlogSchema = Yup.object().shape({
    url: Yup.string().required('Title is required'),
    Name: Yup.string().required('Heading is required'),
    Description: Yup.string().required('Link is required'),
    Image: Yup.mixed().required('Image is required')
  });

  const formik = useFormik({
    initialValues: {
      url: currentSlider?.url || '',
      Name: currentSlider?.Name || '',
      Description: currentSlider?.Description || '',
      Image: isEdit ? `http://localhost:5001/slider-images/${currentSlider?.Link}` : null
    },
    validationSchema: NewBlogSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const fileUpload = new FormData();
      fileUpload.append('file', values.file);

      try {
        const formData = { key: data.key };
        let fileData;
        let fileMeta = {};
        if (values.file) {
          if (isEdit) {
            await deleteFile(data.value.Image, data.value.ImageId);
          }
          fileData = await uploadFile(fileUpload);
          fileMeta = {
            Image: fileData.filename,
            ImageId: fileData.id
          };
        }
        if (isEdit) {
          const temp = [...data.value];
          const index = temp.findIndex((obj) => obj.id === +id);

          if (index !== -1) {
            // Object found, update it
            temp[index] = {
              ...temp[index],
              ...fileMeta,
              url: values.url,
              Name: values.Name,
              Description: values.Description
            };
            formData.value = JSON.stringify(temp);
          } else {
            // Object not found, handle accordingly (throw an error, log a message, etc.)
            console.error(`Object with ID ${id} not found`);
          }
        } else {
          const temp = [...data.value];

          const newItem = {
            id: temp.length + 1,
            ...fileMeta,
            url: values.url,
            Name: values.Name,
            Description: values.Description
          };
          temp.push(newItem);
          formData.value = JSON.stringify(temp);
          console.log('from data: ', formData);
        }

        const response = await axios.patch(`http://localhost:5001/map-resources/${data.id}`, formData);
        console.log('Map Resource Updated: ', response);

        resetForm();
        setSubmitting(false);
        enqueueSnackbar(!isEdit ? 'Create success' : 'Update success', { variant: 'success' });
        // navigate(PATH_DASHBOARD.home.root);
      } catch (error) {
        console.error(error);
        setSubmitting(false);
      }
    }
  });

  const { errors, values, touched, handleSubmit, isSubmitting, setFieldValue, getFieldProps } = formik;

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setFieldValue('file', file);
        setFieldValue('Image', {
          ...file,
          preview: URL.createObjectURL(file)
        });
      }
    },
    [setFieldValue]
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getValueByKey('home-programs');
        result.value = JSON.parse(result.value);
        if (isEdit) {
          console.log(result);
          console.log('id: ', id);
          const index = result.value.findIndex((obj) => obj.id === +id);
          console.log('index: ', index);
          const temp = result.value[index];
          console.log('temp: ', temp);
          let imageUrl = '';
          if (index !== -1) {
            imageUrl = `http://localhost:5001/file-data-images/${temp.Image}`;
          }
          setFieldValue('url', temp.url);
          setFieldValue('Description', temp.Description);
          setFieldValue('Name', temp.Name);
          setFieldValue('Image', imageUrl);
        }
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <FormikProvider value={formik}>
        <Form noValidate autoComplete="off" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="URL"
                    {...getFieldProps('url')}
                    error={Boolean(touched.url && errors.url)}
                    helperText={touched.url && errors.url}
                  />

                  <TextField
                    fullWidth
                    label="Name"
                    {...getFieldProps('Name')}
                    error={Boolean(touched.Name && errors.Name)}
                    helperText={touched.Name && errors.Name}
                  />

                  <TextField
                    fullWidth
                    label="Description"
                    {...getFieldProps('Description')}
                    error={Boolean(touched.Description && errors.Description)}
                    helperText={touched.Description && errors.Description}
                  />
                  <div>
                    <LabelStyle>Image</LabelStyle>
                    <UploadSingleFile
                      maxSize={3145728}
                      accept="image/*"
                      file={values.Image}
                      onDrop={handleDrop}
                      error={Boolean(touched.Image && errors.Image)}
                    />
                    {touched.Image && errors.Image && (
                      <FormHelperText error sx={{ px: 2 }}>
                        {touched.Image && errors.Image}
                      </FormHelperText>
                    )}
                  </div>
                </Stack>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
                <LoadingButton type="submit" fullWidth variant="contained" size="large" loading={isSubmitting}>
                  {!isEdit ? 'Create Slider' : 'Save Changes'}
                </LoadingButton>
              </Stack>
            </Grid>
          </Grid>
        </Form>
      </FormikProvider>
    </>
  );
}
