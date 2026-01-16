"use client"

import { useEffect, useState } from "react"
import { Share2, Copy, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"

interface ProductShareProps {
  productName: string
}

export function ProductShare({ productName }: ProductShareProps) {
  const [isNativeShareSupported, setIsNativeShareSupported] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState("")

  useEffect(() => {
    setUrl(window.location.href)
    if (navigator.share) {
      setIsNativeShareSupported(true)
    }
  }, [])

  const shareData = {
    title: productName,
    text: `Hej, co sądzisz o tej podłodze? ${productName}`,
    url: url,
  }

  const handleNativeShare = async () => {
    try {
      await navigator.share(shareData)
    } catch (error) {
      console.log("Error sharing:", error)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link skopiowany do schowka")
      setIsOpen(false)
    } catch (err) {
      toast.error("Nie udało się skopiować linku")
    }
  }

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Hej, co sądzisz o tej podłodze? ${url}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
    setIsOpen(false)
  }

  if (isNativeShareSupported) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full shrink-0 text-gray-500 hover:text-gray-900"
        onClick={handleNativeShare}
        aria-label="Udostępnij produkt"
      >
        <Share2 className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full shrink-0 text-gray-500 hover:text-gray-900" 
          aria-label="Udostępnij produkt"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="grid gap-1">
          <Button variant="ghost" className="justify-start gap-2 w-full font-normal" onClick={shareViaWhatsApp}>
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button variant="ghost" className="justify-start gap-2 w-full font-normal" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
            Kopiuj link
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
