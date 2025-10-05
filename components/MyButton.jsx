import React from "react";

const Button = React.forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      href,
      className = "",
      disabled,
      ariaLabel,
      onClick,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const base =
      "inline-flex items-center justify-center border font-medium rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed";
    const variants = {
      primary:
        "bg-blue-600 text-white border-transparent hover:bg-blue-700 focus-visible:ring-blue-500",
      secondary:
        "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400",
      ghost:
        "bg-transparent text-blue-600 border-transparent hover:bg-blue-50 focus-visible:ring-blue-200",
      danger:
        "bg-red-600 text-white border-transparent hover:bg-red-700 focus-visible:ring-red-500",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-3 text-base",
    };

    const cls = [base, variants[variant], sizes[size], className]
      .filter(Boolean)
      .join(" ");

    const content = (
      <>
        {isLoading ? (
          <span
            aria-hidden="true"
            style={{ display: "inline-flex", marginRight: children ? 8 : 0 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              role="img"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M22 12a10 10 0 0 0-10-10" strokeOpacity="1">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 12 12"
                  to="360 12 12"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </span>
        ) : (
          leftIcon && (
            <span
              style={{ display: "inline-flex", marginRight: children ? 8 : 0 }}
            >
              {leftIcon}
            </span>
          )
        )}

        <span>{children}</span>

        {!isLoading && rightIcon && (
          <span
            style={{ display: "inline-flex", marginLeft: children ? 8 : 0 }}
          >
            {rightIcon}
          </span>
        )}
      </>
    );

    if (href) {
      return (
        <a
          ref={ref}
          href={isDisabled ? undefined : href}
          role="button"
          aria-disabled={isDisabled}
          aria-label={ariaLabel}
          className={cls}
          onClick={(e) => {
            if (isDisabled) {
              e.preventDefault();
              return;
            }
            onClick && onClick(e);
          }}
          tabIndex={isDisabled ? -1 : 0}
          {...rest}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cls}
        disabled={isDisabled}
        aria-label={ariaLabel}
        onClick={onClick}
        {...rest}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
