import { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import {
  GetApp as ImportIcon,
  Save as SaveIcon,
  Delete
} from '@mui/icons-material';

import { ExtendedButton } from '@/components/ui/ExtendedButton';
import { readText } from '@/util/file-reader';
import EventBus from 'js-event-bus';

const mapStateToProps = (
  state: {
    editorAction: string;
    editorGrid: boolean;
    eventBus: EventBus; }
  ) => {
  return {
    editorAction: state.editorAction,
    editorGrid: state.editorGrid,
    eventBus: state.eventBus
  };
};

const FileOpenSave = (props: { onImport: (v: string) => void; onExport: () => void; onClearArea: () => void; }) => {
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

    const loadFiles = async (e: Event) => {
      try {
        const res = await readText(e.target);
        props.onImport(res as string);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
      }
    };

    fileSelector.addEventListener('change', loadFiles, false);
  }, [props]);

  const handleFileSelect = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    fileSelector.click();
    e.preventDefault();
    (e.target as HTMLInputElement).value = '';
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