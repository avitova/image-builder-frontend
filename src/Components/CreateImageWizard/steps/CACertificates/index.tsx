import React from 'react';

import { CodeEditor, Language } from '@patternfly/react-code-editor';
import {
  Text,
  Form,
  FormGroup,
  FormHelperText,
  Title,
  Alert,
  HelperText,
  HelperTextItem,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
  DropEvent,
} from '@patternfly/react-core';

import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  selectCACerts,
  removeCaCerts,
  addCaCerts,
  CaCertFile,
} from '../../../../store/wizardSlice';
import { useCaCertsValidation } from '../../utilities/useValidation';
import { UploadIcon } from '@patternfly/react-icons';

interface readFile {
  fileName: string;
  data?: string;
  loadResult?: 'danger' | 'success';
  loadError?: DOMException;
}

const CACertificatesStep = () => {
  const dispatch = useAppDispatch();
  const certificates = useAppSelector(selectCACerts);
  const { errors } = useCaCertsValidation();
  const [currentFiles, setCurrentFiles] = React.useState<File[]>([]);
  const [readFileData, setReadFileData] = React.useState<readFile[]>([]);
  const [showStatus, setShowStatus] = React.useState(false);
  const [statusIcon, setStatusIcon] = React.useState('inProgress');
  // TODO: after getting mocks: figure out how to save files
  // so that we can view them

  if (!showStatus && currentFiles.length > 0) {
    setShowStatus(true);
  }

  React.useEffect(() => {
    if (readFileData.length < currentFiles.length) {
      setStatusIcon('inProgress');
    } else if (readFileData.every((file) => file.loadResult === 'success')) {
      setStatusIcon('success');
    } else {
      setStatusIcon('danger');
    }
  }, [readFileData, currentFiles]);

  const handleReadSuccess = (data: string, file: File) => {
    setReadFileData((prevReadFiles) => [...prevReadFiles, { data, fileName: file.name, loadResult: 'success' }]);
    dispatch(addCaCerts([{ name: file.name, content: data }]));
  };

  const handleReadFail = (error: DOMException, file: File) => {
    setReadFileData((prevReadFiles) => [
      ...prevReadFiles,
      { loadError: error, fileName: file.name, loadResult: 'danger' }
    ]);
  };

  const removeFiles = (namesOfFilesToRemove: string[]) => {
    const newCurrentFiles = currentFiles.filter(
      (currentFile) => !namesOfFilesToRemove.some((fileName) => fileName === currentFile.name)
    );

    setCurrentFiles(newCurrentFiles);

    const newReadFiles = readFileData.filter(
      (readFile) => !namesOfFilesToRemove.some((fileName) => fileName === readFile.fileName)
    );

    setReadFileData(newReadFiles);
    dispatch(removeCaCerts(namesOfFilesToRemove));
  };

  const updateCurrentFiles = (files: File[]) => {
    setCurrentFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleFileDrop = (_event: DropEvent, droppedFiles: File[]) => {
    const currentFileNames = currentFiles.map((file) => file.name);
    const reUploads = droppedFiles.filter((droppedFile) => currentFileNames.includes(droppedFile.name));
    
    Promise.resolve()
      .then(() => removeFiles(reUploads.map((file) => file.name)))
      .then(() => updateCurrentFiles(droppedFiles))
      .then(() => {
        droppedFiles.forEach((file) => {
          const reader = new FileReader();
          reader.onload = () => handleReadSuccess(reader.result as string, file);
          reader.onerror = () => handleReadFail(reader.error!, file);
          reader.readAsText(file); // Read the file as text (adjust if needed)
        });
      });
  };
    

  const createHelperText = (file: File) => {
    const fileResult = readFileData.find((readFile) => readFile.fileName === file.name);
    if (fileResult?.loadError) {
      return (
        <HelperText isLiveRegion>
          <HelperTextItem variant="error">{fileResult.loadError.toString()}</HelperTextItem>
        </HelperText>
      );
    }
  };

  const successfullyReadFileCount = readFileData.filter((fileData) => fileData.loadResult === 'success').length;

  
  return (
    <Form>
      <Title headingLevel="h1" size="xl">
        CA Certificates
      </Title>
      <Text>TBD</Text>
      <FormGroup>
        <MultipleFileUpload
          onFileDrop={handleFileDrop}
          dropzoneProps={{
            accept: {
              'application/x-pem-file': ['.pem'],
              'application/x-x509-ca-cert': ['.der', '.cer'],
              'application/pkix-cert': ['.cer'],
            },
          }}
          isHorizontal={true}
        >
          <MultipleFileUploadMain
            titleIcon={<UploadIcon />}
            titleText="Drag and drop your certificates here"
            titleTextSeparator="or"
            infoText="Accepted file types: PEM, DER, CER"
          />
          {showStatus && (
            <MultipleFileUploadStatus
              statusToggleText={`${successfullyReadFileCount} of ${currentFiles.length} files uploaded`}
              statusToggleIcon={statusIcon}
              aria-label="Current uploads"
            >
              {currentFiles.map((file) => (
                <MultipleFileUploadStatusItem
                  file={file}
                  key={file.name}
                  onClearClick={() => removeFiles([file.name])}
                  progressHelperText={createHelperText(file)}
                />
              ))}
            </MultipleFileUploadStatus>
          )}
        </MultipleFileUpload>
        {errors.script && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem variant="error" hasIcon>
                {errors.script}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
    </Form>
  );
};

export default CACertificatesStep;
