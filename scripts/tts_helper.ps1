param (
    [string]$Text,
    [string]$OutPath,
    [int]$Rate = 0,
    [int]$Volume = 100
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = $Rate
$synth.Volume = $Volume
$synth.SetOutputToWaveFile($OutPath)
$synth.Speak($Text)
$synth.Dispose()
Write-Output "Successfully synthesized to $OutPath"
