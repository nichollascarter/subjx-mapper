import { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import {
  GetApp as ImportIcon,
  Save as SaveIcon,
  Delete
} from '@mui/icons-material';

import { ExtendedButton } from '@/components/ui/ExtendedButton';
import { readText } from '@/util/file-reader';

const mapStateToProps = (state: { editorAction: 'string'; editorGrid: boolean; eventBus: any; }) => {
  return {
    editorAction: state.editorAction,
    editorGrid: state.editorGrid,
    eventBus: state.eventBus
  };
};

const FileOpenSave = (props: { onImport: (v: string) => void; onExport: () => void }) => {
  const [fileSelector, setFileSelector] = useState(
    document.createElement('input')
  );

  useEffect(() => {
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('accept', 'image/*');
    fileSelector.setAttribute('id', 'file-upload');
    fileSelector.style.display = 'none';

    setFileSelector(fileSelector);

    const loadFiles = async (e: { target: any; }) => {
      try {
        const res = await readText(e.target);
        props.onImport(res);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
      }
    };

    fileSelector.addEventListener('change', loadFiles, false);
  }, [props]);

  const handleFileSelect = (e: { preventDefault: () => void; target: { value: string; }; }) => {
    fileSelector.click();
    e.preventDefault();
    e.target.value = '';
  };

  const handleExportFile = () => {
    props.onExport();
  };

  return (
    <>
      <ExtendedButton onClick={handleFileSelect}>
        <ImportIcon />
      </ExtendedButton>
      <ExtendedButton onClick={handleExportFile}>
        <SaveIcon />
      </ExtendedButton>
      <ExtendedButton onClick={() => props.onClearArea()}>
        <Delete />
      </ExtendedButton>
    </>
  );
};

export default connect(mapStateToProps)(FileOpenSave);