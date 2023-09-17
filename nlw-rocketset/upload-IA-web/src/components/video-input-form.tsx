import { Label } from "@radix-ui/react-label";
import { Separator } from "@radix-ui/react-separator";
import { FileVideo, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { api } from "@/lib/axios";

type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'success'
const statusMessages = {
  converting: 'Convertendo...',
  generating: 'Transcrevendo...',
  uploading: 'Carregando...',
  success: 'Sucesso !'
}

interface VideoInputFormProps {
  onVideoUploaded: (id: string) => void
}

export function VideoInput(props: VideoInputFormProps){

  const [status, setStatus] = useState<Status>('waiting')

    const promptInputRef = useRef<HTMLTextAreaElement>(null)

    const [files, setFiles] = useState<File | null>(null)

    const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
        const { files } = event.currentTarget

        if(!files){
            return
        }

        const selectedFile = files[0]

        setFiles(selectedFile)


    }

    const convertVideoToAudio = async (video: File) => {
        console.log('Convert started')

        const ffmpeg = await getFFmpeg()

        await ffmpeg.writeFile('input.mp4', await fetchFile(video))

        // ffmpeg.on('log', log => {
        //   console.log(log)
        // })

        ffmpeg.on('progress', progress => {
          console.log('Convert progress:'+ Math.round(progress.progress*100))
        })

        await ffmpeg.exec([
          '-i',
          'input.mp4',
          '-map',
          '0:a',
          '-b:a',
          '20k',
          '-acodec',
          'libmp3lame',
          'output.mp3'
        ])

        const data = await ffmpeg.readFile('output.mp3')
        const audioFileBlob = new Blob([data], {type: 'audio/mpeg'})
        const audioFile = new File([audioFileBlob], 'audio.mp3', {
          type: 'audio/mpeg'
        })


        console.log('Convert finished')

        return audioFile
    }

    const previewURL = useMemo(() => {
        if(!files){
            return undefined
        }

        return URL.createObjectURL(files)
    }, [files])

    const handleUploadVideo = async (event: FormEvent<HTMLFormElement>) => {

        event.preventDefault()

        const prompt = promptInputRef.current?.value

        if(!files){
            return
        }

        setStatus('converting')

        const audioFile = await convertVideoToAudio(files)

        const data = new FormData
        data.append('file', audioFile)

        setStatus('uploading')

        const response = await api.post('/videos', data)
        const audioVideoId = response.data.video.id

        setStatus('generating')

        await api.post(`/videos/${audioVideoId}/transcription`, {
          prompt,
        })

        setStatus('success')

        props.onVideoUploaded(audioVideoId)

    }
    
    return(
        <form onSubmit={handleUploadVideo} className="space-y-6">
        <label
          htmlFor="video"
          className=" relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/10"
        >
          {files ? (
            <video src={previewURL} controls={false} className="pointer-events-none absolute inset-0" />
          ) : (
            <>
                <FileVideo className="w-4 h-4" />
                Selecione um video            
            </>
          )}
        </label>
        <input
          type="file"
          id="video"
          accept="video/mp4"
          className="sr-only"
          onChange={handleFileSelected}
        />

        <Separator />

        <div className="space-y-2 ">
          <Label htmlFor="transcription_prompt">
            Prompt de transcrição
          </Label>

          <Textarea
            ref={promptInputRef}
            disabled={status !== 'waiting'}
            id="transcription_prompt"
            className="h-20 leading-relaxed resize-none"
            placeholder="Inclua palavras-chave mencionadas no vídeo separadas por (,)"
          />
        </div>

        <Button 
          data-success = {status == 'success'}
          disabled={status !== 'waiting'} 
          type="submit" 
          className="w-full data-[success=true]:bg-emerald-400">
          {
            status == 'waiting' ? (
              <>
                Carregar vídeo
                <Upload className="w-4 h-4 ml-2" />
              </>
            )
            : 
            statusMessages[status]
          }
        </Button>
      </form>

    )
}