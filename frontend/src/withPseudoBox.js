import React from 'react'
import { PseudoBox } from '@chakra-ui/core'

const WithPseudoBox = (WrappedComponent) => {
  return function WrappedWithPseudoBox(props) {
    const { mb, ml, mt, mr, ...passThroughProps } = props
    return (
      <PseudoBox {...props}>
        <WrappedComponent {...passThroughProps}/>
      </PseudoBox>
    )
  }
}

// const WithPseudoBox = (WrappedComponent) => {
//   return class extends React.Component {
//     render() {
//       return (
//         <PseudoBox>
//           <WrappedComponent name="password" />
//         </PseudoBox>
//       )
//     }
//   }
// }

export default WithPseudoBox
