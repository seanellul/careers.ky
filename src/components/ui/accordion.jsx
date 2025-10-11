import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext({})

const Accordion = React.forwardRef(({ type, collapsible, className, children, ...props }, ref) => {
  const [openItems, setOpenItems] = React.useState([])

  const toggleItem = (value) => {
    if (type === "single") {
      setOpenItems(openItems.includes(value) ? (collapsible ? [] : openItems) : [value])
    } else {
      setOpenItems(
        openItems.includes(value)
          ? openItems.filter((item) => item !== value)
          : [...openItems, value]
      )
    }
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef(({ className, value, ...props }, ref) => (
  <div ref={ref} data-value={value} className={cn("border-b", className)} {...props} />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { openItems, toggleItem } = React.useContext(AccordionContext)
  const value = props["data-value"] || ref?.current?.parentElement?.getAttribute("data-value")
  
  const handleClick = () => {
    const itemValue = ref?.current?.closest("[data-value]")?.getAttribute("data-value")
    if (itemValue) toggleItem(itemValue)
  }

  const isOpen = value && openItems.includes(value)

  return (
    <button
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      data-state={isOpen ? "open" : "closed"}
      onClick={handleClick}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { openItems } = React.useContext(AccordionContext)
  const value = ref?.current?.closest("[data-value]")?.getAttribute("data-value")
  const isOpen = value && openItems.includes(value)

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all",
        isOpen ? "animate-accordion-down" : "animate-accordion-up hidden"
      )}
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

