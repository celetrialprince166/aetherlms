'use client'

import React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'

/**
 * ClientButton - A button component that safely handles events on the client
 * Resolves the "Event handlers cannot be passed to Client Component props" error
 */
interface ClientButtonProps extends ButtonProps {
  onClick?: () => void
}

export const ClientButton: React.FC<ClientButtonProps> = ({
  children,
  onClick,
  ...props
}) => {
  return (
    <Button onClick={onClick} {...props}>
      {children}
    </Button>
  )
} 