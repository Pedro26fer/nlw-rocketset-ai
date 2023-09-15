import { Label } from "@radix-ui/react-label";
import { Separator } from "@radix-ui/react-separator";
import { FileVideo, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";

export function VideoInput(){

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

    const previewURL = useMemo(() => {
        if(!files){
            return undefined
        }

        return URL.createObjectURL(files)
    }, [files])

    const handleUploadVideo = (event: FormEvent<HTMLFormElement>) => {

        event.preventDefault()

        const prompt = promptInputRef.current?.value

        if(!files){
            return
        }

        

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
            id="transcription_prompt"
            className="h-20 leading-relaxed resize-none"
            placeholder="Inclua palavras-chave mencionadas no vídeo separadas por (,)"
          />
        </div>

        <Button type="submit" className="w-full">
          Carregar vídeo
          <Upload className="w-4 h-4 ml-2" />
        </Button>
      </form>

    )
}