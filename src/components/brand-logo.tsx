import Image from 'next/image'

type BrandLogoProps = {
  variant?: 'full' | 'icon'
  className?: string
  priority?: boolean
}

export function BrandLogo({
  variant = 'full',
  className = '',
  priority = false,
}: BrandLogoProps) {
  if (variant === 'icon') {
    return (
      <Image
        src="/brand/pwm-voucher-icon.png"
        alt="PWM Voucher"
        width={48}
        height={48}
        className={className}
        priority={priority}
      />
    )
  }

  return (
    <Image
      src="/brand/pwm-voucher-logo.png"
      alt="PWM Voucher"
      width={220}
      height={220}
      className={className}
      priority={priority}
    />
  )
}
