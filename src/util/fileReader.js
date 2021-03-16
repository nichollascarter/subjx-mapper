export function readText(filePath) {
    return new Promise((resolve, reject) => {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            const reader = new FileReader();
            let output = '';
            if (filePath.files && filePath.files[0]) {
                reader.onload = (e) => {
                    output = e.target.result;
                    resolve(output);
                };
                reader.readAsText(filePath.files[0]);
            }
        } else {
            reject();
        }
    });
}