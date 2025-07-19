import { prepareInstructions } from 'constants';
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router';
import FileUploader from '~/components/FileUploader';
import NavBar from '~/components/NavBar'
import { convertPdfToImage } from '~/lib/pdf2img';
import { usePuterStore } from '~/lib/puter';
import { generateUUID } from '~/lib/utils';

const upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setisProcessing] = useState(false);
    const [statusText, setstatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file);
    }

    const handleAnalyse = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string; jobTitle: string; jobDescription: string; file: File }) => {
        setisProcessing(true);
        
        setstatusText('Processing your resume...');
        const uploadedFile = await fs.upload([file])
        if (!uploadedFile) return setstatusText('Failed to upload file. Please try again.');

        setstatusText('Converting to Image...');
        const imageFile = await convertPdfToImage(file);
        if (!imageFile.file) return setstatusText('Failed to convert PDF to image.');

        setstatusText('Saving to the image...');
        const uploadedImage = await fs.upload([imageFile.file]); 
        if (!uploadedImage) return setstatusText('Failed to upload image. Please try again.');

        setstatusText('Preparing Data...');

        const uuid = generateUUID();
        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadedImage.path,
            companyName,
            jobTitle,
            jobDescription,
            feedback: '',
        }
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        
        setstatusText('Analyzing .....');
        
        const feedback = await ai.feedback(
            uploadedFile.path,
            prepareInstructions(jobTitle, jobDescription )
        )
        if (!feedback) return setstatusText('Error: Failed to analyze resume');

        const feedbackText = feedback.message.content === 'string'
            ? feedback.message.content 
            : feedback.message.content[0].text;

        data.feedback = JSON.parse(feedbackText)
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        setstatusText('Analysis complete, redirecting...');
        console.log (data)
        navigate(`/resume/${uuid}`);
    }


    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if (!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if (!file) return;

        handleAnalyse({ companyName, jobTitle, jobDescription, file })
    }

    
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <NavBar />
    <section className="main-section">
        <div className='page-heading py-16'>
            <h1>Smart Feedback for your dream job</h1>
            <p>Get personalized insights to enhance your job applications.</p>
            {isProcessing ? (
                <>
                    <h2>{statusText}</h2>
                    <img src='/images/resume-scan.gif' className='w-full' />
                </>
            ) : (
                <h2>Drop your Resume for an ATS score and improvement tips</h2>
            )}
            {!isProcessing && (
                <form id="upload-form" onSubmit={handleSubmit} className='flex flex-col gap-4 mt-8'>
                    <div className='form-div'>
                        <label htmlFor="company-name">Company Name</label>
                        <input type="text" id="company-name" name="company-name"
                        placeholder='Company Name' />
                    </div>
                    <div className='form-div'>
                        <label htmlFor="job-title">Job Title</label>
                        <input type="text" id="job-title" name="job-title"
                        placeholder='Job Title' />
                    </div>
                    <div className='form-div'>
                        <label htmlFor="job-description">Job Description</label>
                        <textarea rows={5} id="job-description" name="job-description"
                        placeholder='Job Description' />
                    </div>
                    <div className='form-div'>
                        <label htmlFor="uploader">Job Description</label>
                        <FileUploader onFileSelect={handleFileSelect} />
                    </div>
                    <button className='primary-button' type="submit">Analyse Resume</button>
                </form>
            )}
        </div>
    </section>
    </main>
  )
}

export default upload
